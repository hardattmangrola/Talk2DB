import google.generativeai as genai
from config import Config


def _safe_extract_text(response):
    """
    Robustly extract text from a generative AI response object.

    Different versions of the generative AI SDK may return different shapes
    (objects, dicts, nested parts). This helper tries multiple common access
    patterns and falls back to a stringified representation so the caller
    always receives a string. This avoids errors like "response.text quick
    accessor requires the response to contain a valid Part" when parts are
    missing.
    """
    try:
        # Prefer attribute access (SDK object with .text)
        if hasattr(response, "text") and response.text is not None:
            return str(response.text)

        # Some SDKs return a simple dict-like structure
        if isinstance(response, dict):
            # common 'candidates' pattern
            candidates = response.get("candidates") or response.get("outputs") or response.get("output")
            if candidates:
                # handle list or single candidate
                if isinstance(candidates, list) and len(candidates) > 0:
                    first = candidates[0]
                    if isinstance(first, dict):
                        # nested 'text' or 'content' fields
                        if "text" in first and first["text"]:
                            return str(first["text"])
                        if "content" in first:
                            content = first["content"]
                            # content may be a list of parts
                            if isinstance(content, list):
                                parts = []
                                for part in content:
                                    if isinstance(part, dict) and "text" in part:
                                        parts.append(str(part["text"]))
                                    elif isinstance(part, str):
                                        parts.append(part)
                                if parts:
                                    return "".join(parts)
                            elif isinstance(content, str) and content:
                                return content

            # fallback to common top-level keys
            for key in ("text", "content", "message", "output_text", "response"):
                if key in response and response[key]:
                    return str(response[key])

        # Some SDKs return objects with nested attributes
        # Try common attribute paths defensively
        if hasattr(response, "candidates"):
            c = getattr(response, "candidates")
            if isinstance(c, (list, tuple)) and len(c) > 0:
                first = c[0]
                if hasattr(first, "text"):
                    return str(first.text)

        # Last resort: stringify the whole response
        return str(response)
    except Exception:
        # If extraction fails, return a safe stringified fallback
        try:
            return str(response)
        except Exception:
            return ""


class AIManager:
    """Manager for interactions with the configured generative AI model.

    This class wraps the SDK usage and provides helper methods used by the
    Flask backend. The implementation uses defensive parsing so any SDK
    response shape is handled gracefully and useful error messages are
    propagated to the API consumer.
    """

    def __init__(self):
        # load configuration (API key, etc.)
        self.config = Config()
        # configure the Google generative AI SDK with the API key
        genai.configure(api_key=self.config.GEMINI_API_KEY)
        # choose a model; this value can be updated via Config if needed
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def generate_sql_query(self, natural_language_query, schema):
        """Convert natural language to a SQL SELECT statement.

        Inputs:
        - natural_language_query: user-provided NL question
        - schema: textual representation of DB schema to help the model

        Returns a SQL string starting with SELECT or raises an Exception on
        unsafe or failed generation.
        """
        sql_prompt = f"""
You are an expert SQL generator. Convert the following natural language query into a valid MySQL SELECT statement.
Schema:
{schema}

Rules:
- Only generate SELECT statements (no DELETE, UPDATE, DROP).
- Ensure all table and column names are valid.
- Do not include explanations or markdown.

Natural language query: "{natural_language_query}"
SQL:
"""

        try:
            # Ask the model to generate SQL. Different SDK versions return
            # different shapes; we parse safely using _safe_extract_text.
            response = self.model.generate_content(sql_prompt)
            sql_query = _safe_extract_text(response).strip()

            # Basic safety check: generated SQL should start with SELECT
            if not sql_query.lower().startswith("select"):
                raise ValueError("Unsafe or non-SELECT query generated")

            return sql_query
        except Exception as e:
            # Provide a clear error message to the caller
            raise Exception(f"SQL generation error: {str(e)}")

    def generate_query_explanation(self, sql_query, results):
        """Generate a short explanation for a SQL query and its results.

        Returns a 2-3 sentence explanation string.
        """
        summary_prompt = f"""
You are a data analyst. Given the following SQL query and its result, write a short, clear explanation
in 2-3 sentences about what this data represents.

SQL Query: {sql_query}
Query Result (sample of up to 5 rows): {results[:5]}
Explanation:
"""

        try:
            response = self.model.generate_content(summary_prompt)
            return _safe_extract_text(response).strip()
        except Exception as e:
            raise Exception(f"Explanation generation error: {str(e)}")

    def analyze_csv_files(self, csv_data_summaries):
        """Analyze CSV files and return a short relationship summary."""
        analysis_prompt = f"""
You are a data analyst. Determine if the following CSV files are related in any way
(e.g., shared keys, similar columns, or logical relationships). Give a clear and short summary of your findings.

CSV Information: {csv_data_summaries}

Answer in 3-4 lines:
"""

        try:
            response = self.model.generate_content(analysis_prompt)
            return _safe_extract_text(response).strip()
        except Exception as e:
            raise Exception(f"CSV analysis error: {str(e)}")

    def query_csv_data(self, user_query, csv_data):
        """Answer free-text questions about uploaded CSV data."""
        query_prompt = f"""
You are an intelligent data analyst.
You have access to the following CSV datasets:
{csv_data}

The user asked: "{user_query}"

Using reasoning on these CSVs, answer clearly in 3-5 lines.
If the answer involves numerical or tabular output, include that in your text naturally.
"""

        try:
            response = self.model.generate_content(query_prompt)
            return _safe_extract_text(response).strip()
        except Exception as e:
            raise Exception(f"CSV query error: {str(e)}")

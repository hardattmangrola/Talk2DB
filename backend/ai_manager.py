import google.generativeai as genai
from config import Config


def _safe_extract_text(response):
    """
    Extract text from a generative AI response object.

    Different versions of the generative AI SDK may return different shapes
    (objects, dicts, nested parts). This helper tries multiple common access
    patterns and falls back to a stringified representation so the caller
    always receives a string. This avoids errors like "response.text quick
    accessor requires the response to contain a valid Part" when parts are
    missing.
    """
    try:
        # If response is an object with .text property → return that.
        if hasattr(response, "text") and response.text is not None:
            return str(response.text)

        # Some SDKs return a simple dict-like structure
        if isinstance(response, dict):
            # If response is a dict → it may have keys like "candidates", "outputs", or "output".
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

            # If none of the above, it checks top-level keys like "text" or "message".
            for key in ("text", "content", "message", "output_text", "response"):
                if key in response and response[key]:
                    return str(response[key])

        # Some SDKs return objects with nested attributes
        # If response is an object with .candidates, it tries .candidates[0].text.
        if hasattr(response, "candidates"):
            c = getattr(response, "candidates")
            if isinstance(c, (list, tuple)) and len(c) > 0:
                first = c[0]
                if hasattr(first, "text"):
                    return str(first.text)

        # Last resort: stringify the whole response
        #Fallback: Return the entire object stringified, so the program never crashes.
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
        # Using gemini-pro-vision (works with SDK 0.8.6)
        self.model = genai.GenerativeModel("gemini-pro")

    def generate_sql_query(self, natural_language_query, schema, allow_destructive=False):
        """Convert natural language query to a SQL statement using Gemini.
        
        If allow_destructive is True, the model is allowed to generate multi-line 
        DML/DDL (DELETE, UPDATE, DROP, etc.) instead of just SELECT.
        """
        role_instructions = "Only generate SELECT statements."
        if allow_destructive:
            role_instructions = "You are allowed to generate DML and DDL statements (SELECT, DELETE, UPDATE, DROP, ALTER) if the user request requires it."

        sql_prompt = f"""
You are an expert SQL generator. Convert the following natural language query into a valid MySQL statement.
Schema:
{schema}

Rules:
- {role_instructions}
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

            # Basic safety check
            sql_lower = sql_query.lower().strip()
            
            if not allow_destructive:
                if not sql_lower.startswith("select"):
                    # Check if it's a DELETE or DROP query
                    if sql_lower.startswith("delete") or sql_lower.startswith("drop"):
                        raise ValueError("Deletion/Drop operations are restricted through the chat interface. Use the admin panel to delete tables. You may not have the required permissions.")
                    else:
                        raise ValueError("Unsafe or non-SELECT query generated. Only SELECT queries are allowed through the chat.")
            else:
                # For administrators, we allow destructive queries but still exclude very dangerous ones like 'drop database'
                if "drop database" in sql_lower:
                    raise ValueError("Database-level DROP operations are not allowed through this interface for safety reasons.")

            return sql_query
        except Exception as e:
            # Provide a clear error message to the caller
            raise Exception(f"SQL generation error: {str(e)}")

    def generate_query_explanation(self, sql_query, results, language="English"):
        """Generate a short explanation for a SQL query and its results in the specified language.

        Returns a 2-3 sentence explanation string.
        """
        summary_prompt = f"""
You are a data analyst. Given the following SQL query and its result, write a short, clear explanation
in 2-3 sentences about what this data represents.
Respond in {language}.

SQL Query: {sql_query}
Query Result (sample of up to 5 rows): {results[:5]}
Explanation:
"""

        try:
            response = self.model.generate_content(summary_prompt)
            return _safe_extract_text(response).strip()
        except Exception as e:
            raise Exception(f"Explanation generation error: {str(e)}")

    def analyze_csv_files(self, csv_data_summaries, language="English"):
        """Analyze CSV files and return a short relationship summary in the specified language."""
        analysis_prompt = f"""
You are a data analyst. Determine if the following CSV files are related in any way
(e.g., shared keys, similar columns, or logical relationships). Give a clear and short summary of your findings.
Respond in {language}.

CSV Information: {csv_data_summaries}

Answer in 3-4 lines:
"""

        try:
            response = self.model.generate_content(analysis_prompt)
            return _safe_extract_text(response).strip()
        except Exception as e:
            raise Exception(f"CSV analysis error: {str(e)}")

    def query_csv_data(self, user_query, csv_data, language="English"):
        """Answer free-text questions about uploaded CSV data in the specified language."""
        query_prompt = f"""
You are an intelligent data analyst.
You have access to the following CSV datasets:
{csv_data}

The user asked: "{user_query}"

Using reasoning on these CSVs, answer clearly in 3-5 lines.
Respond in {language}.
If the answer involves numerical or tabular output, include that in your text naturally.
"""

        try:
            response = self.model.generate_content(query_prompt)
            return _safe_extract_text(response).strip()
        except Exception as e:
            raise Exception(f"CSV query error: {str(e)}")
    def generate_detailed_insights(self, csv_summaries, language="English"):
        """Generate high-level strategic insights for the dataset."""
        prompt = f"""
You are a senior data scientist. Analyze the following summary of a CSV dataset and provide
5-7 high-level strategic insights, patterns, or anomalies discovered.
Respond in {language}.
Include specific mention of outliers or unexpected distributions if present.

Dataset Summary: {csv_summaries}

Key Strategic Insights:
1. 
"""
        try:
            response = self.model.generate_content(prompt)
            return _safe_extract_text(response).strip()
        except Exception as e:
            raise Exception(f"Insights generation error: {str(e)}")

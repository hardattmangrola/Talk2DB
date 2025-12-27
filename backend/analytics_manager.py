import pandas as pd
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
import openpyxl
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import io
import base64

class AnalyticsManager:
    def __init__(self, upload_folder):
        self.upload_folder = upload_folder

    def _get_file_path(self, filename):
        return os.path.join(self.upload_folder, filename)

    def get_column_stats(self, filename):
        filepath = self._get_file_path(filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File {filename} not found")
        
        df = pd.read_csv(filepath)
        stats = {}
        
        for col in df.columns:
            col_stats = {
                "dtype": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique()),
            }
            if pd.api.types.is_numeric_dtype(df[col]):
                # 5-number summary + IQR for outliers
                q1 = float(df[col].quantile(0.25))
                q3 = float(df[col].quantile(0.75))
                iqr = q3 - q1
                lower_bound = q1 - 1.5 * iqr
                upper_bound = q3 + 1.5 * iqr
                outliers = int(((df[col] < lower_bound) | (df[col] > upper_bound)).sum())

                col_stats.update({
                    "mean": float(df[col].mean()) if not df[col].isnull().all() else None,
                    "min": float(df[col].min()),
                    "q1": q1,
                    "median": float(df[col].median()),
                    "q3": q3,
                    "max": float(df[col].max()),
                    "outliers": outliers
                })
            elif pd.api.types.is_string_dtype(df[col]):
                 # Basic distribution for categorical
                 value_counts = df[col].value_counts(normalize=True).head(5).to_dict()
                 col_stats["top_values"] = value_counts

            stats[col] = col_stats
        
        return stats

    def generate_visualizations_base64(self, filename):
        """Generate common plots for the dataset and return as base64 strings."""
        filepath = self._get_file_path(filename)
        df = pd.read_csv(filepath)
        plots = {}

        # 1. Bar chart for first categorical column
        cat_cols = df.select_dtypes(include=['object']).columns
        if not cat_cols.empty:
            col = cat_cols[0]
            plt.figure(figsize=(6, 4))
            df[col].value_counts().head(10).plot(kind='bar')
            plt.title(f'Top values in {col}')
            plots['category_bar'] = self._plot_to_base64()

        # 2. Histogram for first numeric column
        num_cols = df.select_dtypes(include=['number']).columns
        if not num_cols.empty:
            col = num_cols[0]
            plt.figure(figsize=(6, 4))
            sns.histplot(df[col].dropna(), kde=True)
            plt.title(f'Distribution of {col}')
            plots['numeric_hist'] = self._plot_to_base64()

        # 3. Scatter if at least 2 numeric
        if len(num_cols) >= 2:
            plt.figure(figsize=(6, 4))
            sns.scatterplot(data=df, x=num_cols[0], y=num_cols[1])
            plt.title(f'{num_cols[0]} vs {num_cols[1]}')
            plots['numeric_scatter'] = self._plot_to_base64()

        return plots

    def _plot_to_base64(self):
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        plt.close()
        buf.seek(0)
        return base64.b64encode(buf.getvalue()).decode('utf-8')

        return report_filename

    def generate_report(self, filename, report_type='pdf', language='English', insights=""):
        filepath = self._get_file_path(filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File {filename} not found")
        
        df = pd.read_csv(filepath)
        report_filename = f"report_{os.path.basename(filename).split('.')[0]}.{report_type}"
        report_path = os.path.join(self.upload_folder, report_filename)

        if report_type == 'pdf':
            self._create_pdf_report(df, report_path, filename, language, insights)
        elif report_type == 'xlsx':
            df.to_excel(report_path, index=False)
        else:
            raise ValueError("Unsupported report type")
            
        return report_filename

    def _create_pdf_report(self, df, output_path, original_filename, language='English', insights=""):
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        title_text = f"Advanced Data Analysis Report: {original_filename}"
        elements.append(Paragraph(title_text, styles['Title']))
        elements.append(Spacer(1, 12))

        # Strategic Insights (AI Generated)
        if insights:
            elements.append(Paragraph("Strategic AI Insights", styles['Heading2']))
            elements.append(Spacer(1, 6))
            # Split by lines to maintain list format if present
            for line in insights.split('\n'):
                if line.strip():
                    elements.append(Paragraph(line, styles['Normal']))
            elements.append(Spacer(1, 12))

        # Dataset Summary
        elements.append(Paragraph("Dataset Overview", styles['Heading2']))
        summary_text = f"Total Rows: {len(df)} <br/> Total Columns: {len(df.columns)}"
        elements.append(Paragraph(summary_text, styles['Normal']))
        elements.append(Spacer(1, 12))

        # Detailed Stats Table
        elements.append(Paragraph("Statistical Analysis (Numerical)", styles['Heading3']))
        num_cols = df.select_dtypes(include=['number'])
        if not num_cols.empty:
            data = [['Column', 'Min', 'Q1', 'Median', 'Q3', 'Max', 'Outliers']]
            for col in num_cols.columns:
                q1 = float(df[col].quantile(0.25))
                q3 = float(df[col].quantile(0.75))
                iqr = q3 - q1
                data.append([
                    col,
                    f"{df[col].min():.2f}",
                    f"{q1:.2f}",
                    f"{df[col].median():.2f}",
                    f"{q3:.2f}",
                    f"{df[col].max():.2f}",
                    str(int(((df[col] < (q1 - 1.5*iqr)) | (df[col] > (q3 + 1.5*iqr))).sum()))
                ])
            
            table = Table(data, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.black),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 12))

        # Visualizations
        elements.append(Paragraph("Data Visualizations", styles['Heading2']))
        elements.append(Spacer(1, 6))
        
        # 1. Distribution Chart
        if not num_cols.empty:
            col = num_cols.columns[0]
            plt.figure(figsize=(6, 3))
            sns.histplot(df[col].dropna(), kde=True, color='black')
            plt.title(f'Distribution of {col}')
            
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', bbox_inches='tight')
            plt.close()
            img_buffer.seek(0)
            
            img = Image(img_buffer, width=400, height=200)
            elements.append(img)
            elements.append(Spacer(1, 12))

        # 2. Categorical Analysis
        cat_cols = df.select_dtypes(include=['object'])
        if not cat_cols.empty:
            col = cat_cols.columns[0]
            plt.figure(figsize=(6, 3))
            df[col].value_counts().head(10).plot(kind='bar', color='grey')
            plt.title(f'Top values in {col}')
            
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', bbox_inches='tight')
            plt.close()
            img_buffer.seek(0)
            
            img = Image(img_buffer, width=400, height=200)
            elements.append(img)
            elements.append(Spacer(1, 12))

        doc.build(elements)

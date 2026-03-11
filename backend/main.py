from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import matplotlib.pyplot as plt
import seaborn as sns
import base64

app = FastAPI(title="ArktoFlow Execution Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/inspect-csv")
async def inspect_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400, detail="Only CSV files are supported")
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        info = {
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "schema": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "memory_usage_mb": round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
        }
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plot-column")
async def plot_column(
    file: UploadFile = File(...),
    plot_type: str = Form("hist"),
    column_x: Optional[str] = Form(None),
    column_y: Optional[str] = Form(None)
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        # ADD THIS LINE: Strip whitespace and quotes from all column names
        df.columns = df.columns.str.strip().str.replace('"', '')
        # 1. Explicitly set the figure background to match our React node
        plt.figure(figsize=(6, 5), facecolor="#2a2a2a")

        # 2. Force every single text element to be a light gray/white
        sns.set_theme(style="dark", rc={
            "axes.facecolor": "#2a2a2a",
            "figure.facecolor": "#2a2a2a",
            "text.color": "#e5e7eb",
            "axes.labelcolor": "#e5e7eb",
            "xtick.color": "#e5e7eb",
            "ytick.color": "#e5e7eb"
        })

        if plot_type == "hist" and column_x:
            if column_x not in df.columns:
                raise HTTPException(
                    status_code=400, detail="X column not found")
            sns.histplot(df[column_x], kde=True, color="mediumpurple")
            plt.title(f"Histogram of {column_x}", pad=15)

        elif plot_type == "scatter" and column_x and column_y:
            if column_x not in df.columns or column_y not in df.columns:
                raise HTTPException(
                    status_code=400, detail="Columns not found")
            sns.scatterplot(data=df, x=column_x, y=column_y,
                            color="mediumpurple", alpha=0.6)
            plt.title(f"{column_y} vs {column_x}", pad=15)

        elif plot_type == "box" and column_x:
            if column_x not in df.columns:
                raise HTTPException(
                    status_code=400, detail="X column not found")
            sns.boxplot(data=df, x=column_x,
                        y=column_y if column_y else None, color="mediumpurple")
            plt.title(f"Boxplot of {column_x}", pad=15)

        elif plot_type == "corr":
            numeric_df = df.select_dtypes(include=['float64', 'int64'])
            # Added rotation to the heatmap labels so they don't get cut off
            ax = sns.heatmap(numeric_df.corr(), annot=False,
                             cmap="Purples", cbar=True)
            plt.title("Correlation Heatmap", pad=15)
            plt.xticks(rotation=45, ha='right')
            plt.yticks(rotation=0)

        else:
            raise HTTPException(
                status_code=400, detail="Invalid configuration")

        # 3. Turn OFF transparent=True so the background color sticks
        plt.tight_layout()
        buf = io.BytesIO()
        plt.savefig(buf, format="png", transparent=False,
                    facecolor="#2a2a2a", edgecolor='none')
        plt.close()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

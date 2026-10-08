from fastapi import FastAPI

app = FastAPI(title="Metodologias Agiles API")


@app.get("/health")
def health():
    return {"status": "ok"}

# Use official Python slim image
FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory inside the container
WORKDIR /app

# Copy dependency files first (Docker caches this layer — faster rebuilds)
COPY pyproject.toml uv.lock ./

# Install dependencies from the lockfile (no venv, installs straight to system)
RUN uv sync --frozen --no-dev --no-install-project

# Copy the rest of your project
COPY . .

# Create the folder where projects will be saved
RUN mkdir -p /app/MY_PROJECTS

# Expose the port FastAPI will run on
EXPOSE 8000

# Start the app
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

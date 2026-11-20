FROM node:24-alpine AS frontend-build
WORKDIR /frontend
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json ./
COPY postcss.config.js tailwind.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM python:3.12-slim AS app
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 FRONTEND_DIST=/app/frontend/dist
ARG INSTALL_ML=false
COPY requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt
RUN if [ "$INSTALL_ML" = "true" ]; then python -m pip install --no-cache-dir tensorflow==2.19.0; fi
COPY backend ./backend
COPY --from=frontend-build /frontend/dist ./frontend/dist
EXPOSE 5000
CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "5000"]

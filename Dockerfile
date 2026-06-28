# ---------- Stage 1: Build Angular frontend ----------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: Build Spring Boot backend ----------
FROM maven:3.9-eclipse-temurin-21 AS backend
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
# Drop the built Angular app into Spring Boot's static resources so it is served by the API.
COPY --from=frontend /app/frontend/dist/frontend/browser/ ./src/main/resources/static/
RUN mvn -q -B -DskipTests package

# ---------- Stage 3: Runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
# Database lives here; mount this path to a host folder so data survives volume cleanup.
ENV OFFICE_DB_PATH=/data/office.db
VOLUME ["/data"]
COPY --from=backend /app/backend/target/office-management.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

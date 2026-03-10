.PHONY: init up down clean re

init:
	docker run --rm -v $(PWD)/frontend:/app -w /tmp node:20-alpine \
		sh -c "npm create vite@latest myapp -- --template react-ts --yes && npm install --prefix myapp && cp -r myapp/. /app/"
	find backend -mindepth 1 -not -name 'Dockerfile' -delete 2>/dev/null; true
	docker run --rm -v $(PWD)/backend:/app -w /tmp python:3.12-slim \
		sh -c "pip install django djangorestframework && django-admin startproject core /app"
	@printf "django\ndjangorestframework\ndjango-cors-headers\npsycopg2-binary\ndjangorestframework-simplejwt\n" > backend/requirements.txt
	docker compose up --build -d
	docker exec transcendence_backend python manage.py migrate

up:
	docker compose up -d

down:
	docker compose down

clean:
	docker compose down -v --rmi all

re: clean init
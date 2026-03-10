.PHONY: init up down clean re

init:
	docker compose up --build -d
	docker exec transcendence_backend python manage.py migrate

up:
	docker compose up -d

down:
	docker compose down

clean:
	docker compose down -v --rmi all

re: clean init

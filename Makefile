.PHONY: test test-php test-js test-e2e

test: test-php test-js

test-php:
	docker compose exec app php artisan test

test-js:
	cd src && npm test

test-e2e:
	cd src && npx playwright test

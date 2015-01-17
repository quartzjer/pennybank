test:
	./node_modules/.bin/mocha -t 10000 --reporter list

.PHONY: test
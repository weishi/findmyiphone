all: run

run:
	locate.py

deploy:
	cp *.py ~/cgi-bin/

clean:
	-rm *.pyc

all: deploy

run:
	locate.py

deploy:
	cp *.py ~/cgi-bin/
	cp -r www ~/cgi-bin/

clean:
	-rm *.pyc

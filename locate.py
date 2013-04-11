#!/usr/bin/python

import sys,os
import cgi, cgitb, json
from findmyiphone import findMyiPhone

credentials=cgi.FieldStorage()
username=credentials.getvalue('u')
password=credentials.getvalue('p')

fmi=findMyiPhone(username, password)
fmi.login()
result=fmi.getLocation()

print "Content-type: application/json"
print
print json.dumps(result)

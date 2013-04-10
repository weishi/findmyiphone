#!/usr/bin/python

import sys
from findmyiphone import findMyiPhone

username=sys.argv[1]
password=sys.argv[2]
fmi=findMyiPhone(username, password)

fmi.login()

result=fmi.getLocation()

print result

#!/usr/bin/python

import sys,os
import cgi, cgitb, json
import anydbm
import traceback
from findmyiphone import findMyiPhone
from encoder import encoder


print "Content-type: application/json"
print
sys.stderr=sys.stdout

try:
    credentials=cgi.FieldStorage()
    username=credentials.getvalue('u')
    password=credentials.getvalue('p')
    readHistory=credentials.getvalue('readHistory');
    
    enc=encoder(password)
    db=anydbm.open("./loc.db","c")
    result=[]

    #Send history location only
    if readHistory == "true":
        for k, v in db.iteritems():
            entry=enc.decode(v)
            if( "timeStamp" in entry ):
                result.append(json.loads(entry))
    else:
        #Check new location
        fmi=findMyiPhone(username, password)
        fmi.login()
        result=fmi.getLocation()

        #store location to local DB
        for device in result:
            if device['location']:
                timestamp=device['location']['timeStamp']
                db[str(timestamp)]=enc.encode(json.dumps(result));

    db.close();
    print json.dumps(result)
except:
    print "<PRE>"
    traceback.print_exc()

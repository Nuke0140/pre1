#!/bin/bash
export PGPASSWORD=preone
psql -U preone -h 127.0.0.1 -p 54329 -d preone -c 'SELECT count(*) FROM "users";'

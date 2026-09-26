#!/bin/bash
sudo -u postgres psql -p 54329 -c "CREATE USER preone WITH PASSWORD 'preone' SUPERUSER;"
sudo -u postgres psql -p 54329 -c "CREATE DATABASE preone OWNER preone;"

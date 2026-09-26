#!/bin/bash
set -e

CONF=/etc/postgresql/18/main/postgresql.conf
HBA=/etc/postgresql/18/main/pg_hba.conf

echo "Updating postgresql.conf..."
sed -i "s/^#listen_addresses = .*/listen_addresses = '*'/" $CONF
sed -i "s/^listen_addresses = .*/listen_addresses = '*'/" $CONF
sed -i "s/^port = .*/port = 54329/" $CONF

echo "Updating pg_hba.conf..."
grep -q "host all all 0.0.0.0/0 trust" $HBA || echo "host all all 0.0.0.0/0 trust" >> $HBA
grep -q "host all all ::0/0 trust" $HBA || echo "host all all ::0/0 trust" >> $HBA
grep -q "local all all trust" $HBA || echo "local all all trust" >> $HBA

echo "Restarting PostgreSQL service..."
service postgresql restart

echo "Ensuring user preone..."
sudo -u postgres psql -p 54329 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'preone') THEN CREATE ROLE preone WITH LOGIN PASSWORD 'preone' SUPERUSER CREATEDB; END IF; END \$\$;"

echo "Ensuring database preone..."
sudo -u postgres psql -p 54329 -tc "SELECT 1 FROM pg_database WHERE datname = 'preone'" | grep -q 1 || sudo -u postgres psql -p 54329 -c "CREATE DATABASE preone OWNER preone;"

echo "PostgreSQL setup complete and running on port 54329!"

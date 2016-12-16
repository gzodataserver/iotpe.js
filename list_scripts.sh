#!/bin/bash

if [  $# -ne 2 ]
then
  echo -e "\nUsage:\n$0 mysql_username mysql_password\n"
  exit 1
fi

cat > /tmp/script.sql <<EOF
use $1;
select * from scripts\G
EOF

mysql -u$1 -p$2 < /tmp/script.sql

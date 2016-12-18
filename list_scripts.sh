#!/bin/bash

if [  $# -ne 3 ]
then
  echo -e "\nUsage:\n$0 mysql_host mysql_username mysql_password\n"
  exit 1
fi

cat > /tmp/script.sql <<EOF
use $2;
select * from scripts\G
EOF

mysql -h$1 -u$2 -p$3 < /tmp/script.sql

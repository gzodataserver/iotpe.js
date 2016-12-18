#!/bin/bash

if [  $# -ne 5 ]
then
  echo -e "\nUsage:\n$0 mysql_host mysql_username mysql_password script_name file_to_load\n"
  exit 1
fi

cat > /tmp/script.sql <<EOF
use $1;
create table if not exists scripts(name varchar(255), script text);
delete from scripts where name = '$4';
insert into scripts(name,script) values ('$4', load_file('$(pwd)/$5'));
EOF

mysql -h$1 -u$2 -p$3 < /tmp/script.sql

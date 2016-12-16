#!/bin/bash

if [  $# -ne 4 ]
then
  echo -e "\nUsage:\n$0 mysql_username mysql_password script_name file_to_load\n"
  exit 1
fi

cat > /tmp/script.sql <<EOF
use $1;
create table if not exists scripts(name varchar(255), script text);
delete from scripts where name = '$3';
insert into scripts(name,script) values ('$3', load_file('$(pwd)/$4'));
EOF

# insert into scripts('name','script') values ('$3',  );

mysql -u$1 -p$2 < /tmp/script.sql

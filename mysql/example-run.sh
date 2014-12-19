#!/bin/bash
ABS_DIR=`readlink -f $0`
CUR_DIR=`dirname $ABS_DIR`
docker run -d --name mysql \
-v $CUR_DIR/mysql-db:/var/lib/mysql \
-v $CUR_DIR/mysql-conf:/etc/mysql/:ro \
-v $CUR_DIR/mysql-logs:/var/log/ \
-v /tmp/mysqltmp:/var/mysqltmp \
ptqa/zabbix-mysql

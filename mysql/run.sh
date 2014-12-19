#!/bin/bash

function start_mysql()
{
    /etc/init.d/mysql start
    RET=1
      while [[ RET -ne 0 ]]; do
      echo "=> Waiting for confirmation of MySQL service startup"
      sleep 1
      mysql -uroot -S /var/mysqltmp/mysqld.sock -e "status" > /dev/null 2>&1
      RET=$?
    done
}

function check_install_mysql()
{
    local VOLUME_HOME="/var/lib/mysql"
    if [[ ! -d $VOLUME_HOME/mysql ]]; then
        echo "=> An empty or uninitialized MySQL volume is detected in $VOLUME_HOME"
  
       
        echo "=> Installing mysql db..."
        mysql_install_db
        start_mysql
        local PASS="admin"
        echo "=> MySQL admin password: $PASS"
        mysql -uroot -S /var/mysqltmp/mysqld.sock -e "CREATE USER 'admin'@'%' IDENTIFIED BY '$PASS'"
        mysql -uroot -S /var/mysqltmp/mysqld.sock -e "GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%';"
        echo "=> Executing debian MySQL script files ..."
        mysql -uroot -S /var/mysqltmp/mysqld.sock < /etc/mysql/debian.sql
        echo "=> Done"
        service mysql stop
        
    else
        echo "=> Using an existing volume of MySQL"
    fi
}
function check_tmp_dir() {
    local TMP_DIR="/var/mysqltmp"
    echo "Checking if tmpdir $TMP_DIR exists..."
    if [[ ! -d $TMP_DIR ]]; then
        echo "=> Creating mysql tmp dir at $TMP_DIR"
        mkdir -p $TMP_DIR
        mount -t tmpfs -o size=256M,nr_inodes=10k none $TMP_DIR
        chown mysql:mysql $TMP_DIR
    fi
}

# Will try to use docker_tmp_dir
#check_tmp_dir
chown mysql:mysql /var/mysqltmp
check_install_mysql

echo "=> Rinning monit.."
exec monit -d 10 -Ic /etc/monitrc

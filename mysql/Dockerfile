FROM ubuntu:14.04
MAINTAINER ptqa

ENV DEBIAN_FRONTEND noninteractive

RUN echo "mysql-server-5.6 mysql-server/root_password password root" | debconf-set-selections && \
    echo "mysql-server mysql-server/root_password_again password root" | debconf-set-selections
RUN apt-get update && apt-get -y install wget mysql-server monit && \
    apt-get clean 

ADD run.sh /
ADD monitrc /etc/
RUN chmod 755 /run.sh && chmod 700 /etc/monitrc


VOLUME ["/var/lib/mysql","/var/log","/etc/mysql/","/var/mysqltmp"]

EXPOSE 3306
CMD /run.sh

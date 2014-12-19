FROM ubuntu:14.04
MAINTAINER ptqa

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get -y install wget redis-server &&  \
    apt-get clean

EXPOSE 6379
CMD redis-server

FROM ubuntu:14.04
MAINTAINER ptqa

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get -y install wget memcached && \
    apt-get clean

EXPOSE 11211
CMD memcached -u memcache

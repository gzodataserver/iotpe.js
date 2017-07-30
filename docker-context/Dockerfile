FROM node:latest

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get -y install git-all

#Non-Interactive MySQL Setup
RUN echo "mysql-server-5.5 mysql-server/root_password password root" | debconf-set-selections
RUN echo "mysql-server-5.5 mysql-server/root_password_again password root" | debconf-set-selections
RUN apt-get -y install mysql-server-5.5

WORKDIR /root/
RUN git clone https://github.com/gizur/iotpe.js.git iotpe
WORKDIR /root/iotpe/
RUN cp config.template.js config.js
RUN npm install
CMD npm start

EXPOSE 1883

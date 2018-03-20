#!/bin/bash

# get bam (the system used to compile teeworlds)
wget http://github.com/downloads/matricks/bam/bam-0.4.0.zip
unzip bam-0.4.0.zip
cd bam-0.4.0

# compile bam
./make_unix.sh
cd ../
ln -s bam-0.4.0 bam

# clone the custom teeworlds repo
git clone https://github.com/kouchy/teeworlds.git

# switch to the customized teeworlds branch
cd teeworlds/
git checkout 0.6

# compile the teeworlds server
../bam/bam

# save the server binary
cp teeworlds_srv_d ../

# remove all the created dirs
cd ../
rm -rf bam bam-0.4.0 bam-0.4.0.zip teeworlds
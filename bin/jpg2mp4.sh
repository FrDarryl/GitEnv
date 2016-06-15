#!/bin/bash
#----------------------------------------------------------------
# SETTINGS
imageCount=`ls -1 ./*.jpg | wc -l`
imageFiles=`ls -1 ./*.jpg`
outputFile="video.mp4"
crossfade=0.9
#----------------------------------------------------------------

# Making an ffmpeg script...
input=""
filters=""
output="[0:v]"

imageIndex=0

for imageFile in ${imageFiles}; do
  input+=" -loop 1 -t 1 -i ${imageFile}"

  next=$((imageIndex+1))
  if [ "${imageIndex}" -ne "$((imageCount-1))" ]; then
    filters+=" [${next}:v][${imageIndex}:v]blend=all_expr='A*(if(gte(T,${crossfade}),1,T/${crossfade}))+B*(1-(if(gte(T,${crossfade}),1,T/${crossfade})))'[b${next}v];"
  fi

  if [ "${imageIndex}" -gt "0" ]; then
    output+="[b${imageIndex}v][${imageIndex}:v]"
  fi

  imageIndex=$((imageIndex+1))
done

output+="concat=n=$((imageIndex * 2 - 1)):v=1:a=0,format=yuv420p[v]\" -map \"[v]\" ${outputFile}"

script="ffmpeg ${input} -filter_complex \"${filters} ${output}"

echo ${script}

# Run it
eval "${script}"

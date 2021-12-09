import os
from sys import argv
from PIL import Image

working_directory = os.path.dirname(os.path.realpath(__file__))

def path(filename):
  return os.path.join(working_directory, filename)

file1 = argv[1]
file2 = argv[2]

img_source = Image.open(path(file1), 'r')
pixels_source = list(img_source.getdata())

img_match = Image.optn(path(file2), 'r')
pixels_match = list(img_match.getdata())



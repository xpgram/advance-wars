import os
from sys import argv
from PIL import Image

working_directory = os.path.dirname(os.path.realpath(__file__))

def path(filename):
  return os.path.join(working_directory, filename)

file1 = argv[1]
file2 = argv[2]

img_source = Image.open(path(file1), 'r').convert("RGBA")
pixels_source = list(img_source.getdata())

img_match = Image.open(path(file2), 'r').convert("RGBA")
pixels_match = list(img_match.getdata())

if (len(pixels_source) != len(pixels_match)):
  raise ValueError('These images cannot be compared.')

palette = {}

def rgba_to_hexStr(rgba):
  return '0x' + ('%02x%02x%02x%02x' % rgba).upper()

for i in range(0,len(pixels_source)):
  def colorMatch(a, b):
    def match(c1, c2):
      return (abs(c1-c2) / 255) <= (16 / 255)
    return all([match(c1,c2) for c1,c2 in zip(a,b)])

  source = pixels_source[i]
  match = pixels_match[i]

  if not colorMatch(source, match):
    palette[rgba_to_hexStr(source)] = rgba_to_hexStr(match)

for key in palette:
  print(key, ' → ', palette[key])
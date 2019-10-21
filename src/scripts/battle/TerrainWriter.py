import os
import shlex

landTileDefault = True
shallowSourceDefault = True
generatesIncomeDefault = False
repairTypeDefault = 0
concealsDefault = False
visionDefault = 0

# Define terrain-type data package
class Terrain:
    def __init__(self):
        self.className = ""
        self.serial = 0
        self.landTile = True
        self.shallowSource = True
        self.shallowWaterToken = False

        self.name = ""
        self.shortName = ""
        self.description = ""
        self.defenseRating = 0
        self.generatesIncome = False
        self.repairTypeIdx = 0
        self.conceals = False
        self.vision = 0
        self.moveMatrix = [0]*8

        self.factionToken = False
        self.faction = "Neutral"

        self.valueToken = False
        self.valueMax = 0

terrainTypes = []

# Read into memory the entire catalogue
with open(os.path.dirname(os.path.abspath(__file__)) + "\\data\\terrain_data.txt", 'r') as datafile:
#with open("C:\\Users\\XPGram\\Home\\Projects\\advance-wars\\src\\scripts\\battle\\data\\terrain_data.txt", 'r') as datafile:
    datafile.readline()

    count = 0
    for line in datafile.readlines():
        count += 1

        line = shlex.split(line)
        terrain = Terrain()

        terrain.name = line[0]
        terrain.shortName = line[1]

        terrain.className = terrain.name.replace(' ', '')
        terrain.serial = count

        for i in range(0, 8):
            terrain.moveMatrix[i] = int(line[i+2])
        
        terrain.defenseRating = int(line[10])
        terrain.generatesIncome = (line[11] == "1")
        terrain.repairTypeIdx = 1 if (line[12] == "G") else 2 if (line[12] == "N") else 3 if (line[12] == "A") else 0
        terrain.conceals = (line[13] == "1")
        terrain.vision = int(line[14]) if (line[14] != "-") else 0
        terrain.landTile = (line[15] == "1")
        terrain.shallowSource = (line[16] == "1")
        terrain.shallowWaterToken = (not terrain.landTile and not terrain.shallowSource)
        terrain.factionToken = (line[17] == "Cap")
        terrain.valueToken = (line[17] != "-" and not terrain.factionToken)
        terrain.valueMax = 99 if (line[17] == "HP") else 1 if (line[17] == "Use") else 0
        terrain.description = line[18]

        terrainTypes.append(terrain)

# Read into memory the template
template = ""
with open("Terrain.template.ts", 'r') as templateFile:
    for line in templateFile.readlines():
        template += line

# Some pre-gettin-started definitions
globalStart = "//start"
globalEnd = "//end"
tokenDelimiter = "/**/"

def tag(txt):
    return "/*" + txt + "*/"

def boolean(condition):
    return "true" if condition else "false"

def repairType(t):
    types = ['None', 'Ground', 'Naval', 'Air']
    return types[t]

# Write it into the template, over and over, in a new file.
with open("Terrain.source.ts", 'r') as sourcefile:
    with open("Terrain.ts", 'w') as newfile:
        sourcefileLines = sourcefile.readlines()

        # Copy the pre-class lines
        for line in sourcefileLines:
            newfile.write(line)
            if line.strip() == globalStart:
                break

        # Write all terrain objects
        serialNo = -1
        for terrain in terrainTypes:
            serialNo += 1
            if (serialNo != 0):
                newfile.write("\n\n")

            cast = template

            cast = cast.replace(tag("Class"), terrain.className)
            cast = cast.replace(tag("serial"), str(serialNo))
            cast = cast.replace(tag("landTile"), str(boolean(terrain.landTile)))
            cast = cast.replace(tag("shallowWaterSourceTile"), str(boolean(terrain.shallowSource)))
            cast = cast.replace(tag("name"), str(terrain.name))
            cast = cast.replace(tag("shortName"), str(terrain.shortName))
            cast = cast.replace(tag("description"), str(terrain.description))
            cast = cast.replace(tag("defenseRating"), str(terrain.defenseRating))
            cast = cast.replace(tag("generatesIncome"), str(boolean(terrain.generatesIncome)))
            cast = cast.replace(tag("repairType"), repairType(terrain.repairTypeIdx))
            cast = cast.replace(tag("conceals"), str(boolean(terrain.conceals)))
            cast = cast.replace(tag("vision"), str(terrain.vision))
            cast = cast.replace(tag("valueMax"), str(terrain.valueMax))
            
            # Movement costs
            cast = cast.replace(tag("inf"), str(terrain.moveMatrix[0]))
            cast = cast.replace(tag("mch"), str(terrain.moveMatrix[1]))
            cast = cast.replace(tag("trA"), str(terrain.moveMatrix[2]))
            cast = cast.replace(tag("trB"), str(terrain.moveMatrix[3]))
            cast = cast.replace(tag("trd"), str(terrain.moveMatrix[4]))
            cast = cast.replace(tag("air"), str(terrain.moveMatrix[5]))
            cast = cast.replace(tag("shp"), str(terrain.moveMatrix[6]))
            cast = cast.replace(tag("trp"), str(terrain.moveMatrix[7]))

            # Split tokens
            tmpCast = cast.split(tokenDelimiter)

            # Recombine useful tokens
            cast = ""

            if (terrain.landTile == True):
                tmpCast[2] = ""
                tmpCast[3] = ""
                tmpCast[4] = ""
            elif (terrain.shallowSource == True):
                tmpCast[3] = ""
                tmpCast[4] = ""
            
            if (terrain.generatesIncome == False):
                tmpCast[10] = ""
            if (terrain.repairTypeIdx == 0):
                tmpCast[11] = ""
            if (terrain.conceals == False):
                tmpCast[12] = ""
            if (terrain.vision == 0):
                tmpCast[13] = ""
            if (terrain.factionToken == False):
                tmpCast[14] = ""
            if (terrain.valueToken == False):
                tmpCast[15] = ""

            for token in tmpCast:
                cast += token

            # Post
            newfile.write(cast)

        # Copy the post-class lines
        printing = False
        for line in sourcefileLines:
            if line.strip() == globalEnd:
                printing = True
                newFile.write("\n")
            if printing:
                newfile.write(line)
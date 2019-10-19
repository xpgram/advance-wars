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
with open(os.path.dirname(os.path.abspath(__file__)) + "data\\terrain_data.txt", 'r') as datafile:
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
with open("Terrain.template.ts", 'r') as templateFile:
    templateFile.readline()
    # Parse the file for tokens
    # Keep track of... order?
    # I mean, I know the order, I could name them under a dictionary, I guess.

# Some pre-gettin-started definitions
globalStart = "//start"
globalEnd = "//end"
tokenStart = "/**/"
tokenEnd = "/***/"

def tag(txt):
    return "/*" + txt + "*/"

def boolean(condition):
    return "true" if condition else "false"

def repairType(t):
    types = ['None', 'Ground', 'Naval', 'Air']
    return "UnitClass." + types[t]

# Write it into the template, over and over, in a new file.
with open("Terrain.source.ts", 'r') as sourcefile:
    # Copy until after '//start'
    # CopyFrom template into new mold
    # Replace tags with data
    # Post until ain't none left
    # But don't post tokens with default values or '*Token' == False
    # Copy until literal file-end
    with open("Terrain.ts", 'w') as newfile:

        template = ""
        inTemplate = False
        for line in sourcefile.readlines():
            if not inTemplate:
                if line.strip() != "// start":
                    newfile.write(line)
                else:
                    inTemplate = True
            else:
                # Gather the template
                if line.strip() != "// end":
                    template += line
                else:
                    break
        
        # Template gathered, only missing a closing '}'

        # Write all terrain objects
        count = -1
        for terrain in terrainTypes:
            newfile.write("\n")
            count += 1

            cast = template

            cast = cast.replace("Template", terrain.name.replace(' ', ''))
            cast = cast.replace(tag("serial"), str(count))
            cast = cast.replace(tag("land"), str(boolean(terrain.land)))
            cast = cast.replace(tag("shallow"), str(boolean(terrain.shallow)))
            cast = cast.replace(tag("name"), string(terrain.name))
            cast = cast.replace(tag("short name"), string(terrain.shortName))
            cast = cast.replace(tag("defense"), str(terrain.defense))
            cast = cast.replace(tag("income"), str(boolean(terrain.income)))
            cast = cast.replace(tag("repair"), repairType(terrain.repair))
            cast = cast.replace(tag("hideaway"), str(boolean(terrain.hideaway)))
            cast = cast.replace(tag("vision"), str(terrain.vision))
            cast = cast.replace(tag("desc"), string(terrain.desc))

            # Movement costs
            cast = cast.replace(tag("inf"), str(terrain.moveMatrix[0]))
            cast = cast.replace(tag("mch"), str(terrain.moveMatrix[1]))
            cast = cast.replace(tag("trA"), str(terrain.moveMatrix[2]))
            cast = cast.replace(tag("trB"), str(terrain.moveMatrix[3]))
            cast = cast.replace(tag("trd"), str(terrain.moveMatrix[4]))
            cast = cast.replace(tag("air"), str(terrain.moveMatrix[5]))
            cast = cast.replace(tag("shp"), str(terrain.moveMatrix[6]))
            cast = cast.replace(tag("trp"), str(terrain.moveMatrix[7]))

            if (terrain.value):
                cast = cast.replace(tag("value"), valueStub)
            else:
                cast = cast.replace(tag("value"), "")

            newfile.write(cast)

        newfile.write('}')
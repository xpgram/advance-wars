import os
import shlex

totalUnits = 28
totalArmorTypes = 6

# Define unit-type data package
class Unit:
    def __init__(self):
        self.className = ""

        self.soldierUnit = False

        self.serial = 0
        self.name = ""
        self.shortName = ""

        self.cost = 1000
        self.armorType = ""
        self.movementType = ""
        self.unitClass = 'G'
        self.maxMovementPoints = 0
        self.vision = 2
        self.maxGas = 99
        self.materialInstead = False
        self.ammoPoints = 0
        self.rangeMin = 1
        self.rangeMax = 1

        self.primaryName = ""
        self.primaryTargetMatrix = [0] * totalArmorTypes
        self.primaryDamageMatrix = []

        self.secondaryName = ""
        self.secondaryTargetMatrix = [0] * totalArmorTypes
        self.secondaryDamageMatrix = []

        self.description = ""

unitTypes = []


# Read into memory the entire catalogue
with open(os.path.dirname(os.path.abspath(__file__)) + "\\damage_matrix.txt") as dmgFile:
    with open(os.path.dirname(os.path.abspath(__file__)) + "\\unit_data.txt", 'r') as dataFile:
        # Get rid of the first lines
        dmgFile.readline()
        dataFile.readline()

        count = -1
        # Every loop: read in the next line for each of the two files
        for line in dataFile.readlines():
            dmgLine = dmgFile.readline()

            # Increment our serial number
            count += 1

            # Separate the line by whitespace
            data = shlex.split(line)
            dmgData = shlex.split(dmgLine)

            # Create new unit
            unit = Unit()

            # Unit name and javascript data
            unit.className = data[0].replace(' ','').replace('-','')
            unit.name = data[0]
            unit.shortName = data[1]
            unit.serial = count

            # Cost to buy
            unit.cost = int(data[2])

            # Unit properties
            unit.armorType = data[3]
            unit.movementType = data[4]
            unit.unitClass = data[5]

            # Unit stats
            unit.maxMovementPoints = int(data[6])
            unit.vision = int(data[7])
            unit.maxGas = int(data[8])
            unit.materialInstead = (int(data[9]) == 1)
            unit.ammoPoints = int(data[10])
            unit.rangeMin = data[11][0:1]
            unit.rangeMax = data[11][2:3]

            # Converts '-' to 0, basically
            # A battle heuristic ranges from 0–2 and doubles as a can-attack/can't-attack signifier
            # 0 — Can't attack, 1 — Poor attack, 2 — Advantage attack 
            def interpretHeuristic(arg):
                if (arg == '-'):
                    return 0
                else:
                    return int(arg)

            # Primary attack data
            unit.primaryName = data[12]
            unit.primaryTargetMatrix = [
                interpretHeuristic(data[13]),
                interpretHeuristic(data[14]),
                interpretHeuristic(data[15]),
                interpretHeuristic(data[16]),
                interpretHeuristic(data[17]),
                interpretHeuristic(data[18])
                ]

            # Secondary attack data
            unit.secondaryName = data[19]
            unit.secondaryTargetMatrix = [
                interpretHeuristic(data[20]),
                interpretHeuristic(data[21]),
                interpretHeuristic(data[22]),
                interpretHeuristic(data[23]),
                interpretHeuristic(data[24]),
                interpretHeuristic(data[25])
                ]

            # Compile base damage numbers
            # Count by twos: first is primary, second is secondary for a particular unit type
            dmgData = dmgData[1:len(dmgData)]       # Skip unit-type designation
            for i in range(0, int(len(dmgData) / 2)):
                unit.primaryDamageMatrix.append(dmgData[i*2])
                unit.secondaryDamageMatrix.append(dmgData[i*2+1])

            # Soldier/vehicle unit delineation.
            unit.soldierUnit = (int(data[26]) == 1)

            # Unit info-window description
            unit.description = data[27]

            # Add to list
            unitTypes.append(unit)

# Read into memory the template
template = ""
with open(os.path.dirname(os.path.abspath(__file__)) + "\\Unit.template.ts", 'r') as templateFile:
    for line in templateFile.readlines():
        template += line

# Some pre-gettin-started definitions
globalStart = "//start"
globalEnd = "//end"
tokenDelimiter = "/**/"
indentLevel = 0             # Matches the indent of the globalStart flag

# Returns the given string wrapped in open/close comment signifiers.
def tag(txt):
    return "/*" + txt + "*/"

# Converts a boolean to a javascript string
def boolean(condition):
    return "true" if condition else "false"

# Given a string and a substring, erases the line in that string containing that substring
# and returns the resulting string
def eraseToken(string, substring):
    idx = string.find(substring)    # Get token idx

    # If token substring wasn't found, quit
    if idx == -1:
        return

    # Get the starting search location: the end of the line containing the substring.
    endl = string.find('\n', idx)

    # Find the start of the line containing the substring by searching backwards from the end.
    c = ' '
    startl = endl
    while c != '\n' and startl != 0:
        startl -= 1
        c = string[startl]

    # Return the source string minus the middle part: the line containing the substring.
    return string[0 : startl] + string[endl : len(string)]


# Write it into the template, over and over, in a new file.
with open(os.path.dirname(os.path.abspath(__file__)) + "\\Unit.source.ts", 'r') as sourcefile:
    with open(os.path.dirname(os.path.abspath(__file__)) + "\\Unit.ts", 'w') as newfile:
        sourcefileLines = sourcefile.readlines()

        # Copy the pre-class lines
        for line in sourcefileLines:
            newfile.write(line)
            if line.strip() == globalStart:
                indentLevel = len(line.replace(globalStart, '').replace('\n',''))   # Record the indent of //start to write indent into template
                break

        # Indent all lines of the template to match that as found in the source file
        tmp = ""
        for line in template.split('\n'):
            tmp += (' ' * indentLevel) + line + '\n'
        template = tmp[0: len(tmp) - 1]     # Copy back to template, but without trailing '\n'

        # Write all terrain objects
        serialNo = -1
        for unit in unitTypes:
            serialNo += 1
            if (serialNo != 0):
                newfile.write("\n\n")

            cast = template

            cast = cast.replace(tag("ClassName"), unit.className)
            cast = cast.replace(tag("Serial"), str(unit.serial))
            cast = cast.replace(tag("Name"), unit.name)
            cast = cast.replace(tag("ShortName"), unit.shortName)
            cast = cast.replace(tag("Description"), unit.description)
            
            cast = cast.replace(tag("MaxGas"), str(unit.maxGas))
            cast = cast.replace(tag("MaxAmmo"), str(unit.ammoPoints))
            cast = cast.replace(tag("MovePoints"), str(unit.maxMovementPoints))
            cast = cast.replace(tag("Vision"), str(unit.vision))

            cast = cast.replace(tag("UnitClass"), unit.unitClass)
            cast = cast.replace(tag("MoveType"), unit.movementType)
            cast = cast.replace(tag("ArmorType"), unit.armorType)

            # Keep whitespace only if there is a block to space-out (visual convenience only)
            if unit.soldierUnit == False and unit.materialInstead == False:
                cast = eraseToken(cast, tag("NewBlockBreak"))
            else:
                cast = cast.replace(tag("NewBlockBreak"), '')

            # Keep soldierUnit line only if different from default
            if unit.soldierUnit == False:
                cast = eraseToken(cast, tag("SoldierUnit"))
            else:
                cast = cast.replace(tag("SoldierUnit"), '')

            # Keep materialsInstead line only if different from default
            if unit.materialInstead == False:
                cast = eraseToken(cast, tag("MaterialInstead"))
            else:
                cast = cast.replace(tag("MaterialInstead"), '')

            # Write the target matrix
            targMatrix = ""
            for i in range(0, len(unit.primaryTargetMatrix)):
                prim = unit.primaryTargetMatrix[i]
                sec = unit.secondaryTargetMatrix[i]
                targMatrix += "[%s,%s]," % (str(prim), str(sec))
            targMatrix = targMatrix[0:len(targMatrix)-1]    # Remove trailing ','
            cast = cast.replace(tag("TargetMatrix"), targMatrix)

            # Write the damage matrix
            dmgMatrix = ""
            for i in range(0, len(unit.primaryDamageMatrix)):
                prim = unit.primaryDamageMatrix[i]
                sec = unit.secondaryDamageMatrix[i]
                dmgMatrix += "[%s,%s]," % (str(prim), str(sec))
            dmgMatrix = dmgMatrix[0:len(dmgMatrix)-1]       # Remove trailing ','
            cast = cast.replace(tag("DamageMatrix"), dmgMatrix)

            # Post
            newfile.write(cast)

        # Copy the post-class lines
        printing = False
        for line in sourcefileLines:
            if line.strip() == globalEnd:
                printing = True
                newfile.write("\n")
            if printing:
                newfile.write(line)
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
        self.moveAndAttack = True
        self.ammoPoints = 0
        self.rangeMin = 1
        self.rangeMax = 1

        self.primaryName = ""
        self.primaryTargetMap = [0] * totalArmorTypes
        self.primaryDamageMap = []

        self.secondaryName = ""
        self.secondaryTargetMap = [0] * totalArmorTypes
        self.secondaryDamageMap = []

        self.description = ""

unitTypes = []

# Converts '-' to 0, basically
# A battle heuristic ranges from 0–2 and doubles as a can-attack/can't-attack signifier
# 0 — Can't attack, 1 — Poor attack, 2 — Advantage attack 
def interpretHeuristic(arg):
    return 0 if arg == '-' else int(arg)

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
            dmgData = shlex.split(dmgLine)[1:]      # Splice skips the unit-type delineation.

            # Name all data properties for easy interpretation
            # TODO If I used shift() I could just preserve order and do without the numerics.
            name            = data[0]
            shortname       = data[1]
            cost            = data[2]
            armor_type      = data[3]
            movement_type   = data[4]
            unit_class      = data[5]
            move_points     = data[6]
            vision_range    = data[7]
            gas_points      = data[8]
            materials_flag  = data[9]
            ammo_points     = data[10]
            atk_min         = data[11][0:1]
            atk_max         = data[11][2:3]
            primary_name    = data[12]
            primary_map     = [data[13], data[14], data[15], data[16], data[17], data[18]]
            secondary_name  = data[19]
            secondary_map   = [data[20], data[21], data[22], data[23], data[24], data[25]]
            soldier_unit_flag    = data[26]
            move_and_attack_flag = data[27]
            description          = data[28]

            #### Preparation complete: Begin Parsing ####

            # Create new unit
            unit = Unit()

            # Unit name and javascript data
            unit.className = name.replace(' ','').replace('-','')
            unit.name = name
            unit.shortName = shortname
            unit.serial = count

            unit.cost = int(cost)

            unit.armorType = armor_type
            unit.movementType = movement_type
            unit.unitClass = unit_class

            unit.maxMovementPoints = int(move_points)
            unit.vision = int(vision_range)
            unit.maxGas = int(gas_points)
            unit.materialInstead = (materials_flag == '1')
            unit.ammoPoints = int(ammo_points)
            unit.rangeMin = int(atk_min) if atk_min != 'n' else -1
            unit.rangeMax = int(atk_max) if atk_max != 'n' else -1

            unit.soldierUnit = (soldier_unit_flag == '1')
            unit.moveAndAttack = (move_and_attack_flag == '1')

            unit.description = description

            # Weapon data
            unit.primaryName = primary_name
            unit.primaryTargetMap = list( map(lambda d: interpretHeuristic(d), primary_map) )
            unit.secondaryName = secondary_name
            unit.secondaryTargetMap = list( map(lambda d: interpretHeuristic(d), secondary_map) )

            # Base damage numbers —— count by twos: values are [primary, secondary] for a given unit type
            unit.primaryDamageMap = dmgData[::2]
            unit.secondaryDamageMap = dmgData[1::2]
            
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
        return string

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

            # Keep range line only if different from default
            if unit.rangeMin == 1 and unit.rangeMax == 1:
                cast = eraseToken(cast, tag("Range"))
            else:
                cast = cast.replace(tag("Range"), '')
                cast = cast.replace(tag("RangeMin"), str(unit.rangeMin))
                cast = cast.replace(tag("RangeMax"), str(unit.rangeMax))

            # Keep whitespace only if there is a block to space-out (visual convenience only)
            if (unit.soldierUnit == False
              and unit.materialInstead == False
              and unit.moveAndAttack == True):
                cast = eraseToken(cast, tag("UnitPropertiesBlockBreak"))
            else:
                cast = cast.replace(tag("UnitPropertiesBlockBreak"), '')

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

            # Keep MoveAndAttack line only if different from default
            if unit.moveAndAttack:
                cast = eraseToken(cast, tag("MoveAndAttack"))
            else:
                cast = cast.replace(tag("MoveAndAttack"), '')

            # Primary Weapon
            numToString = lambda n: str(n)
            primTargMap = '[{}]'.format(','.join(map(numToString, unit.primaryTargetMap)))
            primDmgMap  = '[{}]'.format(','.join(map(numToString, unit.primaryDamageMap)))
            subTargMap  = '[{}]'.format(','.join(map(numToString, unit.secondaryTargetMap)))
            subDmgMap   = '[{}]'.format(','.join(map(numToString, unit.secondaryDamageMap)))

            cast = cast.replace(tag("PrimName"), unit.primaryName)
            cast = cast.replace(tag("PrimTargetMap"), primTargMap)
            cast = cast.replace(tag("PrimDamageMap"), primDmgMap)
            cast = cast.replace(tag("SubName"), unit.secondaryName)
            cast = cast.replace(tag("SubTargetMap"), subTargMap)
            cast = cast.replace(tag("SubDamageMap"), subDmgMap)

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
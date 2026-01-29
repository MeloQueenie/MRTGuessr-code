import math

def calc_y(x):
    # Clamps
    if x <= 8:
        return 5000
    elif x >= 15000:
        return 0
    else:
    # Main formula
        return math.floor(5000 * ((1 - (x - 8) / 19996) ** 6))

# Few quick examples
# print(f"3m away = {calc_y(3)}")
# print(f"300m away = {calc_y(300)}")
# print(f"1000m away = {calc_y(1000)}")
# print(f"5000m away = {calc_y(5000)}")
# print(f"15000m away = {calc_y(15000)}")
# print(f"25000m away = {calc_y(25000)}")
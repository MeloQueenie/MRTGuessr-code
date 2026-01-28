import math

def calc_y(x):
    # Clamps
    if x <= 4:
        return 5000
    elif x >= 10000:
        return 0
    else:
        return math.floor(5000 * ((1 - (x - 4) / 19996) ** 12))

# Few quick examples
# print(f"3m away = {calc_y(3)}")
# print(f"300m away = {calc_y(300)}")
# print(f"1000m away = {calc_y(1000)}")
# print(f"5000m away = {calc_y(5000)}")
# print(f"15000m away = {calc_y(15000)}")
# print(f"25000m away = {calc_y(25000)}")
Door Controller
===============

Door controller for Southampton Makerspace.

**NOTE**: If you're looking for the RFID version, check the [rfid
branch](https://github.com/somakeit/door-controller/tree/rfid) - we've
since switched over to a PIN entry system instead.

Keypad
------

We're currently using a 3x4 matrix keypad hooked up to the Raspberry
Pi GPIO headers.

![Matrix keypad](http://www.adafruit.com/images/970x728/419-00.jpg)

Strike
------

We use a transistor hooked to a GPIO in order to energise a relay which
releases the DC strike so the door can open.

Wiring
------

Using regular pin numbering:

The keypad columns are hooked up from left to right to pins 16, 18 and
22.

The keypad rows are hooked up from top to bottom to pins 11, 12, 13 and
15.

The latch is triggered on pin 7 (but it also requires 5V (pin 2) and
ground (pin 6) connections).

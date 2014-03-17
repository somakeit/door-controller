door-controller
===============

door controller for So Make It

This is the first pass at the rfid door entry system for So Make It.

The main rfid read is currently a usb [Violet Mir:ror][mirror] (see [images] for some pictures). 
It is a usb hidraw device which spits out a stream of hex data. Mostly nulls. When it encounters a card it sends a few 
control bytes, which also indicate if the card added or removed (3 cards can be concurrently read), followed by the id
of the card. For most ISO/IEC 14443-3 Type A cards it reads only the short v1 id field. Many cards actually have longer
7 byte id's, but these are downmapped to a 4 byte id by this reader. This is often described as [cascasde] level 1. 
This will probably need fixing one day with different hardware

The plan is to run this code from a BeagleBone black. Note that the level of Node.js 0.8 that ships on the BBB is too low,
so it needs upgrading (building from source can be done in a few hours). There is one other issue on the beaglebones, 
and that is that the usb stack dies frequently with Angstrom [1](https://github.com/beagleboard/kernel/issues/64) [2](http://o.cs.uvic.ca:20810/perl/cid.pl?cid=1374a430f81a67c5c594c3f3c84c58845ed7caec)
Arch linux seems fine though.

[cascade]: http://www.nxp.com/documents/application_note/AN10927.pdf "MIFARE and handling of UIDs"
[mirror]: https://en.wikipedia.org/wiki/Mir:ror "Mir:ror on wikipedia"
[images]: https://www.google.co.uk/search?q=violet+mirror&espv=2&es_sm=125&tbm=isch&tbo=u&source=univ&sa=X&ei=89MmU5OnOYuqhAfjsoDYDw&ved=0CC8QsAQ&biw=1680&bih=891#q=violet+mir:ror&tbm=isch "Google image search"

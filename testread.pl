#!/usr/bin/perl
use strict;
use warnings;

use Carp qw/croak/;

my $known_cards = load_known_cards();
read_for_cards($known_cards);

sub load_known_cards {
    my $cards_file = 'known_cards.txt';
    open( my $FH, '<', $cards_file ) || croak "Error opening $cards_file $!";
    my $data = {};
    while ( my $line = <$FH> ) {
        chomp $line;
        if ( $line =~ /(\S+) \s+ (.+)/xms ) {
            $data->{$1} = $2;
        }
    }
    close $FH || croak "Error closing $cards_file $!";
    return $data;
}

sub find_card_owner {
    my ( $card_id, $known_cards ) = @_;
    my $owner = 'unknown';
    if ( $known_cards->{$card_id} ) {
        $owner = $known_cards->{$card_id};
    }
    return $owner;
}

sub read_for_cards {
    my ($known_cards) = @_;

    my $dev = '/dev/mirror';
    open( my $MIRROR, '<', $dev ) || croak "Error opening $dev $!";
    binmode $MIRROR;
    while (1) {
        read $MIRROR, my $byte, 1;
        $byte = unpack 'H*', $byte;
        if ( $byte eq '02' ) {
            read $MIRROR, my $onoff, 1;
            $onoff = unpack 'H*', $onoff;
            my $action =
                $onoff eq '01' ? 'on'
              : $onoff eq '02' ? 'off'
              :                  $onoff;
            read $MIRROR, my $record, 8;
            my $card = unpack 'H*', $record;
            my $owner = find_card_owner( $card, $known_cards );
            printf "%-3s %s %s\n", $action, $card, $owner;
        }
    }
    close $MIRROR || croak "Error closing $dev $!";
    return;
}


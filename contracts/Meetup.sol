pragma solidity ^0.4.4;

import "github.com/Arachnid/solidity-stringutils/strings.sol";

contract Meetup {
    /**
     * NOTES
     *
     * "organizer" is the person creating meetups.
     */

    mapping (address => bytes32[]) public organizerMeetups;
    mapping (bytes32 => MeetupEvent) meetups;

    struct MeetupEvent {
        string title;
        string description;
    }

    function createMeetup(string _title, string _description) returns (bytes32) {
        address organizer = msg.sender;
        MeetupEvent memory meetup = MeetupEvent({title: _title, description: _description});

        // TODO use a unique ID
        string key = addressToString(organizer).toSlice().concat(_title.toSlice());
        bytes32 meetupHash = sha3(key);

        meetups[meetupHash] = meetup;
        organizerMeetups[organizer].push(meetupHash);

        return meetupHash;
    }

    function getMeetupHashes(address organizer) returns (bytes32[]) {
        return organizerMeetups[organizer];
    }

    function getMeetup(bytes32 meetupHash) returns (string, string) {
        MeetupEvent meetup = meetups[meetupHash];

        string title = meetup.title;
        string description = meetup.description;

        return (title, description);
    }

    /*
    function deleteMeetup(bytes32 meetupHash) returns (bool) {

    }
    */

    // https://ethereum.stackexchange.com/a/8347/5093
    function addressToString(address x) returns (string) {
        bytes memory b = new bytes(20);
        for (uint i = 0; i < 20; i++) {
            b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
        }
        return string(b);
    }
}

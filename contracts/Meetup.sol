pragma solidity ^0.4.4;

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
        bytes32 meetupHash = sha3(_title);

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
}

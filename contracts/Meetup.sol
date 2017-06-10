pragma solidity ^0.4.4;

//import "../lib/solidity-stringutils/strings.sol";

contract Meetup {
    // stringutils
    //using strings for *;

    /**
     * NOTES
     *
     * "organizer" is the person creating meetups.
     */

    /**
      * Meetup Events
      */
    event MeetupCreated(address organizer, bytes32 meetupHash);
    event MeetupUpdated(address organizer, bytes32 meetupHash);
    event MeetupDeleted(address organizer, bytes32 meetupHash);

    /**
      * meetup hashes that belong to an organzier
      */
    mapping (address => bytes32[]) organizerMeetups;

    /**
      * meetups table
      * key is a hash, value is the struct.
      */
    mapping (bytes32 => MeetupEvent) meetups;

    /**
      * array containing all hashes of meetups
     */
    bytes32[] meetupHashes;

    /**
      * Contract owner
      */
    address owner;

    /**
      * Meetup event struct
      */
    struct MeetupEvent {
        bytes32 id;
        string title;
        string description;
        string location;
        string tags; // comma separated
        string image;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 createdTimestamp;
        address organizer;
    }

    function Meetup() {
        owner = msg.sender;
    }

    function changeOwner(address newOwner) {
        if (msg.sender == owner) {
            owner = newOwner;
        }
    }

    function createMeetup(
        string _title,
        string _description,
        string _location,
        string _tags,
        string _image,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) returns (bytes32) {
        address organizer = msg.sender;

        /*
        if (!verifyStartTimestamp(_startTimestamp)) {
            throw;
        }

        if (!verifyEndTimestamp(_startTimestamp, _endTimestamp)) {
            throw;
        }
        */

        if (!verifyTitle(bytes(_title))) {
            throw;
        }

        if (!verifyDescription(bytes(_description))) {
            throw;
        }

        if (!verifyLocation(bytes(_location))) {
            throw;
        }

        // dumb verification of ipfs multihash
        if (!verifyImageHash(bytes(_image))) {
            throw;
        }

        // unique meetup hash for id
        bytes32 meetupHash = keccak256(_title, organizer, block.number, block.timestamp);

        MeetupEvent memory meetup = MeetupEvent({
            id: meetupHash,
            title: _title,
            description: _description,
            location: _location,
            tags: _tags,
            image: _image,
            startTimestamp: _startTimestamp,
            endTimestamp: _endTimestamp,
            createdTimestamp: block.timestamp,
            organizer: organizer
        });

        meetups[meetupHash] = meetup;
        organizerMeetups[organizer].push(meetupHash);
        meetupHashes.push(meetupHash);

        MeetupCreated(organizer, meetupHash);

        return meetupHash;
    }

    function editMeetup(
        bytes32 meetupHash,
        string _title,
        string _description,
        string _location,
        string _tags,
        string _image,
        uint256 _startTimestamp,
        uint256 _endTimestamp
    ) returns (bytes32) {
        MeetupEvent meetup = meetups[meetupHash];

        // must be organizer of meetup or owner of contract
        if (meetup.organizer != msg.sender) {
            if (owner != msg.sender) {
                throw;
            }
        }

        /*
        if (!verifyStartTimestamp(_startTimestamp)) {
            throw;
        }

        if (!verifyEndTimestamp(_startTimestamp, _endTimestamp)) {
            throw;
        }
        */

        if (!verifyTitle(bytes(_title))) {
            throw;
        }

        if (!verifyDescription(bytes(_description))) {
            throw;
        }

        if (!verifyLocation(bytes(_location))) {
            throw;
        }

        if (!verifyImageHash(bytes(_image))) {
            throw;
        }

        meetup.title = _title;
        meetup.description = _description;
        meetup.location = _location;
        meetup.tags = _tags;
        meetup.image = _image;
        meetup.startTimestamp = _startTimestamp;
        meetup.endTimestamp = _endTimestamp;

        MeetupUpdated(meetup.organizer, meetupHash);

        return meetupHash;
    }

    function getAllMeetupHashes() returns (bytes32[]) {
        return meetupHashes;
    }

    function getMeetupHashesByOrganizer(address organizer) returns (bytes32[]) {
        return organizerMeetups[organizer];
    }

    function getMeetupByHash(bytes32 meetupHash) returns (
        bytes32,
        string,
        string,
        string,
        string,
        string,
        uint256,
        uint256,
        uint256,
        address
    ) {
        MeetupEvent meetup = meetups[meetupHash];

        /*
         * check if meetup does not exist.
         * delete mapping items get initialized to their default.
         */
        if (sha3(meetup.title) == sha3("")) {
            throw;
        }

        return (
            meetup.id,
            meetup.title,
            meetup.description,
            meetup.location,
            meetup.tags,
            meetup.image,
            meetup.startTimestamp,
            meetup.endTimestamp,
            meetup.createdTimestamp,
            meetup.organizer
        );
    }

    function deleteMeetupByHash(bytes32 meetupHash) returns (bool) {
        address organizer = meetups[meetupHash].organizer;

        // must be organizer of meetup or owner of contract
        if (organizer != msg.sender) {
            if (owner != msg.sender) {
                throw;
            }
        }

        for (uint i = 0; i < organizerMeetups[organizer].length; i++) {
            if (organizerMeetups[organizer][i] == meetupHash) {
                removeFromOrganizerMeetupsArray(organizer, i);
                delete meetups[meetupHash];

                MeetupDeleted(organizer, meetupHash);

                for (uint j = 0; j < meetupHashes.length; j++) {
                    if (meetupHashes[j] == meetupHash) {
                        removeFromMeetupHashesArray(j);

                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
      * UTILITY FUNCTIONS
      */

    // https://ethereum.stackexchange.com/a/8347/5093
    function addressToString(address x) returns (string) {
        bytes memory b = new bytes(20);
        for (uint i = 0; i < 20; i++) {
            b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
        }
        return string(b);
    }

    // https://ethereum.stackexchange.com/a/1528/5093
    function removeFromOrganizerMeetupsArray(address organizer, uint index) returns (bytes32[]) {
        bytes32[] storage array = organizerMeetups[organizer];
        if (index >= array.length) return;

        for (uint i = index; i < array.length - 1; i++) {
            array[i] = array[i + 1];
        }

        delete array[array.length - 1];
        array.length = array.length - 1;
        return array;
    }

    function removeFromMeetupHashesArray(uint index) returns (bytes32[]) {
        bytes32[] storage array = meetupHashes;
        if (index >= array.length) return;

        for (uint i = index; i < array.length - 1; i++) {
            array[i] = array[i + 1];
        }

        delete array[array.length - 1];
        array.length = array.length - 1;
        return array;
    }

    // https://ethereum.stackexchange.com/a/2834/5093
    function bytes32ToString(bytes32 x) constant returns (string) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;
        for (uint j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }

    function verifyTitle(bytes title) constant returns (bool) {
        // Must have title
        if (title.length > 0) {
            return true;
        }

        return false;
    }

    function verifyDescription(bytes description) constant returns (bool) {
        // Must have description
        if (description.length > 0) {
            return true;
        }

        return false;
    }

    function verifyLocation(bytes location) constant returns (bool) {
        // Must have description
        if (location.length > 0) {
            return true;
        }

        return false;
    }

    function verifyStartTimestamp(uint256 startTimestamp) constant returns (bool) {
        // Start time cannot be a date from the past
        if (startTimestamp >= block.timestamp) {
            return true;
        }

        return false;
    }

    function verifyEndTimestamp(
        uint256 startTimestamp,
        uint256 endTimestamp
    ) constant returns (bool) {
        // Start time cannot be afer end time
        if (startTimestamp <= endTimestamp) {
            return true;
        }

        return false;
    }

    // "dumb" verification of ipfs multihash
    function verifyImageHash(bytes hash) constant returns (bool) {
        return true;
        if (hash.length > 0 &&
            hash.length <= 46 &&
            hash[0] == "Q" &&
            hash[1] == "m") {
            return true;
        }

        return false;
    }
}

/*
// TODO
contract MeetupGroup {

// Categories

        Outdoors & Adventure
        Tech
        Family
        Health & Wellness
        Sports & Fitness
        Learning
        Photography
        Food & Drink
        Writing
        Language & Culture
        Music
        Movements
        LGBTQ
        Film
        Sci-Fi & Games
        Beliefs
        Arts
        Book Clubs
        Dance
        Pets
        Hobbies & Crafts
        Fashion & Beauty
        Social
        Career & Business
}
*/

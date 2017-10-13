pragma solidity ^0.4.4;

contract Meetup {
    /**
     * NOTES
     *
     * "organizer" is the person creating meetup.
     */

    /**
      * Meetup Events
      */
    event _MeetupCreated(uint indexed id);
    event _MeetupUpdated(uint indexed id);

    struct MeetupPost {
      uint id;
      address organizer;
      string ipfsHash;
    }

    /**
      * meetups map
      *
      * structure
      * meetups[organizer][id] => ipfs hash
      *
      * example
      * meetups[0x123...abc][1] => Qm123...abc
      */
    mapping (uint => MeetupPost) meetups;

    /**
      * Latest sequential meetup ID
      */
    uint public seqId = 0;

    /**
      * Contract owner
      */
    address owner;

    /**
      * Constructor
      */
    function Meetup() {
        owner = msg.sender;
    }

    /**
      * Change contract owner
      */
    function changeOwner(address newOwner) external {
        if (msg.sender == owner) {
            owner = newOwner;
        }
    }

    /**
      * Create a new meetup post
      */
    function createMeetup(
      string ipfsHash
    ) external {
        address organizer = msg.sender;

        seqId = seqId + 1;
        meetups[seqId] = MeetupPost(seqId, organizer, ipfsHash);

        _MeetupCreated(seqId);
    }

    /**
      * Edit ipfs hash of a post
      */
    function editMeetup(
        uint id,
        string ipfsHash
    ) external {
        address organizer = msg.sender;

        MeetupPost storage meetup = meetups[id];
        require(meetup.organizer == organizer);
        meetups[id].ipfsHash = ipfsHash;

        _MeetupUpdated(id);
    }

    /**
      * Retrieve a meetup post by ID
      */
    function getMeetup(uint id) external constant returns (uint, address, string) {
      MeetupPost storage meetup = meetups[id];

      return (meetup.id, meetup.organizer, meetup.ipfsHash);
    }
}

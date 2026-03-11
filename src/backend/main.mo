import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type SessionId = Nat;
  type AttendanceId = Nat;
  type PinCode = Text;

  public type SessionStatus = {
    #active;
    #closed;
  };

  public type Session = {
    id : SessionId;
    title : Text;
    pin : PinCode;
    status : SessionStatus;
    createdAt : Time.Time;
    attendeeCount : Nat;
  };

  public type Attendance = {
    id : AttendanceId;
    sessionId : SessionId;
    name : Text;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  module Session {
    public func compare(session1 : Session, session2 : Session) : Order.Order {
      Nat.compare(session1.id, session2.id);
    };
  };

  module Attendance {
    public func compare(attendance1 : Attendance, attendance2 : Attendance) : Order.Order {
      Nat.compare(attendance1.id, attendance2.id);
    };
  };

  let sessions = Map.empty<SessionId, Session>();
  let attendances = Map.empty<AttendanceId, Attendance>();
  let pinToSessionId = Map.empty<PinCode, SessionId>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextSessionId : SessionId = 1;
  var nextAttendanceId : AttendanceId = 1;
  var nextPin : Nat = 100000;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Check if any admin has been assigned yet
  public query func isFirstAdminClaimed() : async Bool {
    AccessControl.isAdminAssigned(accessControlState);
  };

  // Claim first admin role - only works when no admin exists
  public shared ({ caller }) func claimFirstAdmin() : async Bool {
    AccessControl.claimFirstAdmin(accessControlState, caller);
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Admin Functions
  public shared ({ caller }) func createSession(title : Text) : async SessionId {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let pin = await* generateSequentialPin();

    let sessionId = nextSessionId;
    nextSessionId += 1;

    let session : Session = {
      id = sessionId;
      title;
      pin;
      status = #active;
      createdAt = Time.now();
      attendeeCount = 0;
    };

    sessions.add(sessionId, session);
    pinToSessionId.add(pin, sessionId);

    sessionId;
  };

  public shared ({ caller }) func closeSession(sessionId : SessionId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let session = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };
    if (session.status != #active) {
      Runtime.trap("Session is already closed");
    };

    let updatedSession = { session with status = #closed };
    sessions.add(sessionId, updatedSession);
  };

  public query ({ caller }) func getAllSessions() : async [Session] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    sessions.values().toArray().sort();
  };

  public query ({ caller }) func getSessionAttendees(sessionId : SessionId) : async [Attendance] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let session = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };

    attendances.values().toArray().filter(
      func(a) { a.sessionId == session.id }
    ).sort();
  };

  // Public Functions (No authentication required)
  public shared func submitAttendance(name : Text, pin : PinCode) : async () {
    let sessionId = switch (pinToSessionId.get(pin)) {
      case (null) { Runtime.trap("Invalid PIN") };
      case (?id) { id };
    };

    let session = switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };

    if (session.status != #active) {
      Runtime.trap("Session is closed");
    };

    let attendanceId = nextAttendanceId;
    nextAttendanceId += 1;

    let attendance : Attendance = {
      id = attendanceId;
      sessionId;
      name;
      timestamp = Time.now();
    };

    attendances.add(attendanceId, attendance);
    let updatedSession = {
      session with
      attendeeCount = session.attendeeCount + 1;
    };
    sessions.add(sessionId, updatedSession);
  };

  // Helper Functions
  func generateSequentialPin() : async* PinCode {
    let pin = nextPin.toText();
    nextPin += 1;
    if (pin.size() == 6) { return pin };
    await* generateSequentialPin();
  };
};

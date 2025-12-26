// Configuration file
export const config = {
  project: {
    name: "EasyGoing Education",
    slogan: "Empowering Minds, One Step at a Time",
    description:
      "At Easy Going Educations, we make learning flexible and enjoyable. Our tailored programs help you grow at your own pace, with expert support and a stress-free approach. Whether you want to enhance skills or explore new topics, we make education accessible for everyone!",
  },
  contact: {
    info: {
      phone1: {
        value: "+1(312)813 25 64",
        link: "tel:+13128132564",
      },
      phone2: {
        value: "+1(312)813 25 61",
        link: "tel:+13128132561",
      },
      email: {
        value: "info@easygoingeducations.com",
        link: "mailto:info@easygoingeducations.com",
      },
      address: {
        value: "1325 W Webster Ave, Chicago, IL 60614, USA",
        link: "https://maps.app.goo.gl/kt8rZDCESpodJ66Q7",
      },
    },
    website: "https://easygoingeducations.com",
    map: {
      embed:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d428.73226813356894!2d-87.66233122998248!3d41.921503806323!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fd2e3c2861885%3A0xbb24fc26bc6a201d!2s1325%20W%20Webster%20Ave%2C%20Chicago%2C%20IL%2060614%2C%20USA!5e0!3m2!1sen!2sbe!4v1729095805299!5m2!1sen!2sbe",
    },
  },
  apiURL: "/api",
  educationTerms: [
    { label: "Fall", value: "FALL_SEMESTER" },
    { label: "Spring", value: "SPRING_SEMESTER" },
  ],
  genders: [
    { label: "Female", value: "FEMALE" },
    { label: "Male", value: "MALE" },
  ],
  days: [
    { value: "MONDAY", label: "Monday" },
    { value: "TUESDAY", label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY", label: "Thursday" },
    { value: "FRIDAY", label: "Friday" },
    { value: "SATURDAY", label: "Saturday" },
    { value: "SUNDAY", label: "Sunday" },
  ],
  userRightsOnRoutes: [
    {
      urlRegex: /\/dashboard$/,
      roles: ["ADMIN", "MANAGER", "ASSISTANT_MANAGER", "TEACHER", "STUDENT"],
    },
    { urlRegex: /\/dashboard\/admin$/, roles: ["ADMIN"] },
    { urlRegex: /\/dashboard\/manager$/, roles: ["ADMIN"] },
    {
      urlRegex: /\/dashboard\/assistant-manager$/,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      urlRegex: /\/dashboard\/teacher$/,
      roles: ["ADMIN", "ASSISTANT_MANAGER"],
    },
    {
      urlRegex: /\/dashboard\/student$/,
      roles: ["ADMIN", "ASSISTANT_MANAGER"],
    },
    { urlRegex: /\/dashboard\/student-info$/, roles: ["TEACHER"] },
    { urlRegex: /\/dashboard\/meet$/, roles: ["TEACHER"] },
    { urlRegex: /\/dashboard\/choose-lesson$/, roles: ["STUDENT"] },
    { urlRegex: /\/dashboard\/grades-meets$/, roles: ["STUDENT"] },
  ],
};


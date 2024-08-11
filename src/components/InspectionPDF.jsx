import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: "#2c3e50",
    fontWeight: "bold",
  },
  questionGroup: {
    marginBottom: 15,
  },
  question: {
    fontSize: 12,
    marginBottom: 5,
    color: "#34495e",
    fontWeight: "bold",
  },
  response: {
    fontSize: 11,
    marginBottom: 5,
    marginLeft: 10,
    color: "#555",
  },
  image: {
    width: 100, // Reduced width
    height: 100, // Reduced height
    marginBottom: 10,
    marginLeft: 10,
    objectFit: "contain",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#7f8c8d",
    fontSize: 10,
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    right: 40,
    fontSize: 10,
    color: "#7f8c8d",
  },
  photo: {
    marginVertical: 10,
    width: 100, // Reduced width for photos
    height: 100, // Reduced height for photos
    objectFit: "contain",
  },
});

const InspectionPDF = ({ inspectionData }) => (
  <Document>
    <Page style={styles.page}>
      {Object.entries(inspectionData).map(([sectionKey, sectionData]) => (
        <View key={sectionKey} style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionKey}</Text>
          {sectionData.map((item) => (
            <View key={item.id} style={styles.questionGroup}>
              <Text style={styles.question}>{item.question || item.id}</Text>
              {item.id === "inspectorSignature" && item.response ? (
                <Image src={item.response} style={styles.image} />
              ) : (
                <Text style={styles.response}>{item.response}</Text>
              )}
              {item.photo && <Image src={item.photo} style={styles.photo} />}
            </View>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);

export default InspectionPDF;

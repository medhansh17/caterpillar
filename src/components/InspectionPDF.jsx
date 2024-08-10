import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#E4E4E4',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  fieldTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 10,
    marginBottom: 10,
  },
  image: {
    marginVertical: 15,
    marginHorizontal: 'auto',
    maxWidth: '80%',
    maxHeight: 200,
  },
});

const InspectionPDF = ({ inspectionData, images }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Inspection Report</Text>

        {/* Header Section */}
        <Text style={styles.sectionTitle}>General Information</Text>
        {['truckSerialNumber', 'truckModel', 'inspectionId', 'inspectorName', 'inspectionEmployeeId', 'dateOfInspection', 'timeOfInspection', 'locationOfInspection', 'geoCoordinates', 'serviceMeterHours', 'customerName', 'catCustomerId'].map((field) => (
          <View key={field}>
            <Text style={styles.fieldTitle}>{field}:</Text>
            <Text style={styles.fieldValue}>{inspectionData[field] || 'N/A'}</Text>
          </View>
        ))}

        {/* Tires Section */}
        <Text style={styles.sectionTitle}>Tires</Text>
        {['tirePressureLeftFront', 'tirePressureRightFront', 'tireConditionLeftFront', 'tireConditionRightFront', 'tirePressureLeftRear', 'tirePressureRightRear', 'tireConditionLeftRear', 'tireConditionRightRear', 'overallTireSummary'].map((field) => (
          <View key={field}>
            <Text style={styles.fieldTitle}>{field}:</Text>
            <Text style={styles.fieldValue}>{inspectionData[field] || 'N/A'}</Text>
          </View>
        ))}
        {images['tirePressureLeftFront'] && <Image src={images['tirePressureLeftFront']} style={styles.image} />}
        {images['tirePressureRightFront'] && <Image src={images['tirePressureRightFront']} style={styles.image} />}
        {images['tirePressureLeftRear'] && <Image src={images['tirePressureLeftRear']} style={styles.image} />}
        {images['tirePressureRightRear'] && <Image src={images['tirePressureRightRear']} style={styles.image} />}

        {/* Battery Section */}
        <Text style={styles.sectionTitle}>Battery</Text>
        {['batteryMake', 'batteryReplacementDate', 'batteryVoltage', 'batteryWaterLevel', 'conditionOfBattery', 'leakOrRustInBattery', 'batteryOverallSummary'].map((field) => (
          <View key={field}>
            <Text style={styles.fieldTitle}>{field}:</Text>
            <Text style={styles.fieldValue}>{inspectionData[field] || 'N/A'}</Text>
          </View>
        ))}
        {images['batteryCondition'] && <Image src={images['batteryCondition']} style={styles.image} />}

        {/* Exterior Section */}
        <Text style={styles.sectionTitle}>Exterior</Text>
        {['rustDentDamageExterior', 'oilLeakInSuspension', 'overallSummaryExterior'].map((field) => (
          <View key={field}>
            <Text style={styles.fieldTitle}>{field}:</Text>
            <Text style={styles.fieldValue}>{inspectionData[field] || 'N/A'}</Text>
          </View>
        ))}
        {images['exteriorDamage'] && <Image src={images['exteriorDamage']} style={styles.image} />}

        {/* Brakes Section */}
        <Text style={styles.sectionTitle}>Brakes</Text>
        {['brakeFluidLevel', 'brakeConditionFront', 'brakeConditionRear', 'emergencyBrake', 'brakeOverallSummary'].map((field) => (
          <View key={field}>
            <Text style={styles.fieldTitle}>{field}:</Text>
            <Text style={styles.fieldValue}>{inspectionData[field] || 'N/A'}</Text>
          </View>
        ))}
        {images['brakeCondition'] && <Image src={images['brakeCondition']} style={styles.image} />}

        {/* Engine Section */}
        <Text style={styles.sectionTitle}>Engine</Text>
        {['rustDentsDamageEngine', 'engineOilCondition', 'engineOilColor', 'brakeFluidCondition', 'brakeFluidColor', 'oilLeakInEngine', 'overallEngineSummary'].map((field) => (
          <View key={field}>
            <Text style={styles.fieldTitle}>{field}:</Text>
            <Text style={styles.fieldValue}>{inspectionData[field] || 'N/A'}</Text>
          </View>
        ))}
        {images['engineCondition'] && <Image src={images['engineCondition']} style={styles.image} />}

        {/* Voice of Customer Section */}
        <Text style={styles.sectionTitle}>Voice of Customer</Text>
        {['customerFeedback'].map((field) => (
          <View key={field}>
            <Text style={styles.fieldTitle}>{field}:</Text>
            <Text style={styles.fieldValue}>{inspectionData[field] || 'N/A'}</Text>
          </View>
        ))}
        {images['customerIssues'] && <Image src={images['customerIssues']} style={styles.image} />}

        {/* Inspector Signature */}
        <Text style={styles.sectionTitle}>Inspector Signature</Text>
        {inspectionData.inspectorSignature && (
          <Image src={inspectionData.inspectorSignature} style={styles.image} />
        )}
      </View>
    </Page>
  </Document>
);

export default InspectionPDF;
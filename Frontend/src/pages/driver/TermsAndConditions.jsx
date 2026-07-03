import React from 'react';
import { Container, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Divider, Box } from '@mui/material';
import { Check as CheckIcon, Warning as WarningIcon, LocalPolice as PoliceIcon, 
  DirectionsCar as CarIcon, Speed as SpeedIcon, PhoneAndroid as PhoneIcon, 
  Traffic as TrafficIcon, LocalHospital as HospitalIcon, 
  CreditCard as DocumentIcon, Gavel as GavelIcon, 
  People as PeopleIcon, Shield as ShieldIcon, EmojiPeople as CustomerIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: '10px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 'bold',
  marginBottom: theme.spacing(3),
  textAlign: 'center',
  position: 'relative',
  '&:after': {
    content: '""',
    display: 'block',
    width: '100px',
    height: '4px',
    background: theme.palette.primary.main,
    margin: '10px auto 0',
    borderRadius: '2px',
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.dark,
  fontWeight: '600',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const StyledListItem = styled(ListItem)(({ theme }) => ({
  paddingLeft: theme.spacing(1),
  alignItems: 'flex-start',
  '& .MuiListItemIcon-root': {
    minWidth: '36px',
    marginTop: theme.spacing(0.5),
  },
}));

const TermsAndConditions = () => {
  const terms = [
    {
      icon: <WarningIcon color="error" />,
      title: "No Drinking and Driving",
      description: "Drinking and driving is strictly prohibited. The legal blood-alcohol limit is 0.03% (30mg per 100ml of blood). Violations can result in fines from ₹2,000 to ₹25,000 and/or imprisonment from 7 months to 4 years."
    },
    {
      icon: <DocumentIcon color="primary" />,
      title: "Valid Vehicle Insurance",
      description: "You must maintain valid third-party liability insurance. Driving without insurance can result in a fine of ₹2,000 for the first offense and up to ₹4,000 for subsequent offenses."
    },
    {
      icon: <CheckIcon color="success" />,
      title: "Seat Belt Usage",
      description: "Always wear your seat belt while driving. Violations can result in a fine of up to ₹1,000."
    },
    {
      icon: <PhoneIcon color="warning" />,
      title: "No Mobile Phone Use",
      description: "Using a mobile phone while driving is only permitted for navigation purposes. Talking on the phone or other uses can result in a fine up to ₹5,000 and/or imprisonment for up to one year."
    },
    {
      icon: <SpeedIcon color="error" />,
      title: "No Over-speeding",
      description: "Adhere to posted speed limits. Over-speeding can result in fines ranging from ₹1,000 to ₹2,000 depending on the vehicle type."
    },
    {
      icon: <TrafficIcon color="primary" />,
      title: "Obey Traffic Signals",
      description: "Always follow traffic signals and stop at red lights. Violations can result in fines up to ₹10,000 or imprisonment for one year."
    },
    {
      icon: <HospitalIcon color="info" />,
      title: "Yield to Emergency Vehicles",
      description: "Always give way to emergency vehicles with active sirens. Failure to do so can result in a fine up to ₹10,000."
    },
    {
      icon: <CarIcon color="action" />,
      title: "Proper Number Plate Display",
      description: "Ensure your vehicle's number plate is clearly visible and not damaged. Driving with an obscured or damaged plate is a serious offense."
    },
    {
      icon: <DocumentIcon color="primary" />,
      title: "Carry Required Documents",
      description: "Always carry your valid driving license, RC, PUC, and insurance documents while driving. Driving without a license can result in a fine up to ₹5,000."
    },
    {
      icon: <GavelIcon color="error" />,
      title: "No Rash Driving",
      description: "Rash driving is strictly prohibited and can result in fines up to ₹50,000 and other legal consequences."
    },
    {
      icon: <ShieldIcon color="success" />,
      title: "Vehicle Insurance Requirements",
      description: "Maintain valid car insurance as it's mandatory under the Indian Motor Vehicle Act 1988. It provides financial protection against accidents, theft, and third-party liabilities."
    },
    {
      icon: <PeopleIcon color="primary" />,
      title: "Professional Conduct",
      description: "Maintain professional behavior with all passengers. Any form of misconduct will not be tolerated and may result in immediate termination of services."
    },
    {
      icon: <ShieldIcon color="success" />,
      title: "Passenger Safety",
      description: "Passenger safety is our top priority. Always ensure safe driving practices and maintain your vehicle in good condition."
    },
    {
      icon: <CustomerIcon color="primary" />,
      title: "Customer Service",
      description: "Always treat passengers with respect and courtesy. Provide excellent customer service and assist passengers with their needs when appropriate."
    }
  ];

  return (
    <Container maxWidth="md">
      <StyledPaper elevation={3}>
        <StyledTitle variant="h4" component="h1">
          Driver Terms and Conditions
        </StyledTitle>
        
        <Typography variant="body1" paragraph>
          Welcome to our platform. By using our services as a driver, you agree to comply with the following terms and conditions. These rules are designed to ensure safety and quality service for all users.
        </Typography>

        <SectionTitle variant="h5" component="h2">
          <PoliceIcon /> Safety and Legal Requirements
        </SectionTitle>
        
        <List>
          {terms.slice(0, 10).map((term, index) => (
            <React.Fragment key={index}>
              <StyledListItem>
                <ListItemIcon>{term.icon}</ListItemIcon>
                <ListItemText
                  primary={<Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>{term.title}</Typography>}
                  secondary={term.description}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </StyledListItem>
              {index < terms.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>

        <SectionTitle variant="h5" component="h2">
          <PeopleIcon /> Professional Conduct
        </SectionTitle>
        
        <List>
          {terms.slice(10).map((term, index) => (
            <React.Fragment key={index + 10}>
              <StyledListItem>
                <ListItemIcon>{term.icon}</ListItemIcon>
                <ListItemText
                  primary={<Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>{term.title}</Typography>}
                  secondary={term.description}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </StyledListItem>
              {index < terms.slice(10).length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>

        <Box mt={4} p={2} bgcolor="#f5f5f5" borderRadius={2}>
          <Typography variant="body2" color="textSecondary">
            <strong>Note:</strong> These terms and conditions are subject to change without prior notice. It is your responsibility to review them regularly. Continued use of our services constitutes acceptance of any modifications.
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default TermsAndConditions;

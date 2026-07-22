import { Close } from "@mui/icons-material";
import { Grid2, Typography, Modal, Box, Button, IconButton } from "@mui/material";
import Image from "next/image";
import { Fragment, useState } from "react";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800,
  bgcolor: '#FFFFFF',
  border: 'none',
  borderRadius: "20px",
  boxShadow: 50,
  p: "30px",
};

export default function ContactUsButton({
  reset,
}: {
  reset: () => void,
}) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Fragment>
      <Button
        variant="contained"
        disableElevation
        onClick={handleOpen}
        sx={{
          backgroundColor: "#003E8A",
          borderRadius: "10px",
          padding: "10px 14px",
          height: "50px",
          textTransform: "none",
          fontSize: "17px",
          fontWeight: 400,
          lineHeight: "130%",
          letterSpacing: "-0.3px",
          textAlign: "left",
          verticalAlign: "middle",
          color: "#FFFFFF",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <svg style={{marginRight: "12px"}} width="28" height="23" viewBox="0 0 20 17" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.7778 0C19.0033 0 20 1.0166 20 2.26667V14.7333C20 15.9834 19.0033 17 17.7778 17H2C0.895432 17 0 16.1046 0 15V2.26667C0 1.0166 0.996667 0 2.22222 0H17.7778ZM10.6662 9.97311C10.4739 10.12 10.2403 10.2 10 10.2C9.75971 10.2 9.52614 10.12 9.33377 9.97311L2.22222 4.53333V14.7333H17.7778V4.53333L10.6662 9.97311ZM2.96224 2.26667L10 7.65L17.0378 2.26667H2.96224Z" fill="#FAFAFA"/>
        </svg>
        Contact us
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Grid2
            container
            direction="column"
            justifyContent="flex-start"
          >
            <Grid2 container alignItems={"center"} justifyContent="space-between">
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "20px",
                  lineHeight: "150%",
                  letterSpacing: "-1%",
                  color: "#303843",
                }}
              >
                Excited about the Future of AI?
              </Typography>
              <IconButton disableRipple aria-label="close" onClick={(e) => handleClose()} sx={{padding: 0}}>
                <Close sx={{color: "black"}}/>
              </IconButton>
            </Grid2>
            <div
              style={{
                borderBottom: "1px solid #DEDEDE",
                margin: "22px 0px",
              }}
            ></div>
            <Grid2
              container
              direction="column"
              alignItems={"center"}
            >
              <Image
                src="/contact_us_qr.png"
                alt="contact@mobilint.com"
                width={172}
                height={172}
                style={{margin: "22px 0px"}}
              />
              <Typography
                textAlign={"center"}
                sx={{
                  fontWeight: "regular",
                  fontSize: "16px",
                  lineHeight: "150%",
                  letterSpacing: "-1%",
                  color: "#303843",
                }}
              >
                If you would like to assess your AI infrastructure needs and determine solution fit,
                <br />
                feel free to reach out to us at <span style={{fontWeight: "bold"}}>contact@mobilint.com</span>.
              </Typography>
            </Grid2>
            <Grid2
              container
              justifyContent="flex-end"
              columnSpacing={"16px"}
              sx={{
                marginTop: "60px",
              }}
            >
              <Button
                variant="outlined"
                disableRipple
                sx={{
                  borderRadius: "40px",
                  padding: "10px 20px",
                  textTransform: "none",
                  fontSize: "16px",
                  fontWeight: "regular",
                  lineHeight: "150%",
                  letterSpacing: "-1%",
                  color: "#303843",
                  borderColor: "#B0B0B0",
                }}
                onClick={(e) => handleClose()}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                disableRipple
                sx={{
                  borderRadius: "40px",
                  padding: "10px 20px",
                  textTransform: "none",
                  fontSize: "16px",
                  fontWeight: "regular",
                  lineHeight: "150%",
                  letterSpacing: "-1%",
                  color: "#FFFFFF",
                  backgroundColor: "#006BEF",
                }}
                onClick={(e) => {handleClose(); reset();}}
              >
                Get Creative New Chat
              </Button>
            </Grid2>
          </Grid2>
        </Box>
      </Modal>
    </Fragment>
  );
}
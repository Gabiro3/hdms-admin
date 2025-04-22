import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, Clock, MapPin, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SupportContactInfo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contact Healthlink Support</CardTitle>
          <CardDescription>
            Our support team is available to help you with any questions or issues you may have.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <Phone className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Phone Support</p>
              <p className="text-sm text-muted-foreground">Available Monday to Friday, 9am - 5pm</p>
              <p className="mt-1 text-lg">+1 (800) 123-4567</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Mail className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Email Support</p>
              <p className="text-sm text-muted-foreground">We'll respond within 24 hours</p>
              <p className="mt-1 text-lg">support@healthlink.com</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Support Hours</p>
              <p className="text-sm text-muted-foreground">When our team is available</p>
              <p className="mt-1">Monday - Friday: 9:00 AM - 5:00 PM EST</p>
              <p>Saturday: 10:00 AM - 2:00 PM EST</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
          <CardDescription>
            Find answers to common questions and learn how to use the system effectively.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Healthlink Headquarters</p>
              <p className="text-sm text-muted-foreground">Our main office location</p>
              <p className="mt-1">123 Medical Drive</p>
              <p>Suite 400</p>
              <p>Boston, MA 02110</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="#" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                User Documentation
              </Link>
            </Button>

            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="#" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Video Tutorials
              </Link>
            </Button>

            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="#" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Frequently Asked Questions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
